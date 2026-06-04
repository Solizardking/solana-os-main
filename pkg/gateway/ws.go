// Package gateway :: ws.go
// WebSocket transport for the SolanaOS Gateway bridge.
// Allows browser clients (Chrome extension) to connect to the same
// TCP bridge port via WebSocket upgrade.
package gateway

import (
	"bufio"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// wsUpgrader handles the HTTP → WebSocket upgrade.
var wsUpgrader = websocket.Upgrader{
	CheckOrigin:  func(r *http.Request) bool { return true },
	Subprotocols: []string{"solanaos-gateway"},
}

// handleWebSocketUpgrade is called when the first bytes of a TCP connection
// look like an HTTP GET request. The bufio.Reader still has all data buffered
// (peeked, not consumed), so we wrap it into a conn the http.Server can read.
func (b *Bridge) handleWebSocketUpgrade(ctx context.Context, conn net.Conn, br *bufio.Reader) {
	// Wrap the connection so reads come from the buffered reader first.
	bufferedConn := &bufReaderConn{Reader: br, Conn: conn}

	done := make(chan struct{})
	srv := &http.Server{
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer close(done)
			ws, err := wsUpgrader.Upgrade(w, r, nil)
			if err != nil {
				b.logf("🌐 WebSocket upgrade failed from %s: %v", conn.RemoteAddr(), err)
				return
			}
			b.logf("🌐 WebSocket client connected from %s", conn.RemoteAddr())
			b.handleWebSocketConn(ctx, ws)
		}),
	}
	_ = srv.Serve(&singleConnListener{conn: bufferedConn, done: done})
}

// handleWebSocketConn runs the gateway protocol over a WebSocket connection.
func (b *Bridge) handleWebSocketConn(ctx context.Context, ws *websocket.Conn) {
	defer ws.Close()

	nodeID := ""
	authenticated := false
	role := ""
	var wsWriteMu sync.Mutex
	writeJSON := func(frame map[string]any) {
		wsWriteMu.Lock()
		defer wsWriteMu.Unlock()
		_ = ws.WriteJSON(frame)
	}

	// Send connect challenge nonce.
	nonce := generateWSNonce()
	writeJSON(map[string]any{
		"type":  "event",
		"event": "connect.challenge",
		"payload": map[string]any{
			"nonce": nonce,
		},
	})

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		_, msg, err := ws.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				b.logf("🌐 WebSocket error from %s: %v", nodeID, err)
			}
			break
		}

		var frame map[string]any
		if err := json.Unmarshal(msg, &frame); err != nil {
			continue
		}

		frameType, _ := frame["type"].(string)

		switch frameType {
		case "req":
			id, _ := frame["id"].(string)
			method, _ := frame["method"].(string)
			params, _ := frame["params"].(map[string]any)
			b.handleWSRequest(writeJSON, id, method, params, &nodeID, &role, &authenticated)

		case "ping":
			pingID, _ := frame["id"].(string)
			writeJSON(map[string]any{"type": "pong", "id": pingID})

		case "event":
			if !authenticated {
				_ = ws.WriteJSON(map[string]any{
					"type":    "error",
					"code":    "AUTH_REQUIRED",
					"message": "authenticate first",
				})
				continue
			}
			evt, _ := frame["event"].(string)
			b.logf("📡 WS event from %s: %s", nodeID, evt)
		}
	}

	if nodeID != "" {
		if role == "node" {
			b.mu.Lock()
			delete(b.nodes, nodeID)
			b.mu.Unlock()
		}
		b.logf("🌐 WebSocket client disconnected: %s", nodeID)
	}
}

func (b *Bridge) handleWSRequest(writeJSON func(map[string]any), id, method string, params map[string]any, nodeID *string, role *string, authenticated *bool) {
	switch method {
	case "connect":
		client, _ := params["client"].(map[string]any)
		clientID, _ := client["id"].(string)
		displayName, _ := client["displayName"].(string)
		clientRole, _ := params["role"].(string)
		if clientID == "" {
			clientID = "ws-client-" + generateShortID()
		}
		if displayName == "" {
			displayName = "WebSocket Client"
		}
		if clientRole == "" {
			clientRole = "operator"
		}
		*nodeID = clientID
		*role = clientRole
		*authenticated = true

		if clientRole == "node" {
			b.mu.Lock()
			b.nodes[clientID] = &connectedNode{
				nodeID:      clientID,
				displayName: displayName,
				role:        clientRole,
				transport:   "ws",
				token:       "ws-session",
				sendJSON: func(frame map[string]any) error {
					writeJSON(frame)
					return nil
				},
				connectedAt: time.Now(),
			}
			b.mu.Unlock()
			b.logf("🔗 WebSocket node connected: %s (%s)", clientID, displayName)
		} else {
			b.logf("🔗 WebSocket client connected: %s (%s) role=%s", clientID, displayName, clientRole)
		}

		PushConvexEvent(ConvexEvent{
			Kind:   "connect",
			NodeID: clientID,
			Payload: map[string]any{
				"displayName": displayName,
				"role":        clientRole,
				"transport":   "websocket",
			},
		})

		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"server": map[string]any{
					"host":    b.BridgeAddr(),
					"name":    "SolanaOS Gateway",
					"version": "3.1.0",
				},
				"auth": map[string]any{
					"deviceToken": "ws-" + generateShortID(),
					"role":        clientRole,
					"scopes":      []string{"operator.read", "operator.write"},
				},
				"snapshot": map[string]any{
					"sessionDefaults": map[string]any{
						"mainSessionKey": "main",
					},
				},
			},
		})

	case "health":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"daemon":   "alive",
				"status":   "alive",
				"oodaMode": "live",
				"uptime":   time.Since(time.Now().Add(-24 * time.Hour)).Seconds(),
				"nodes":    len(b.ConnectedNodes()),
			},
		})
	case "node.invoke.request", "node.invoke":
		response := b.handleNodeInvokeRequest(params)
		frame := map[string]any{
			"type": "res",
			"id":   id,
			"ok":   response.ok,
		}
		if response.payload != nil {
			frame["payload"] = response.payload
		} else if response.payloadJSON != "" {
			frame["payloadJSON"] = response.payloadJSON
		}
		if response.error != nil {
			frame["error"] = map[string]any{
				"code":    response.error.Code,
				"message": response.error.Message,
			}
		}
		writeJSON(frame)
	case "node.invoke.result":
		invokeID, _ := params["id"].(string)
		if strings.TrimSpace(invokeID) == "" {
			writeJSON(map[string]any{
				"type": "res",
				"id":   id,
				"ok":   false,
				"error": map[string]any{
					"code":    "INVALID_REQUEST",
					"message": "id required",
				},
			})
			return
		}
		resp := invokeResponse{
			ok:      params["ok"] == true,
			payload: params["payload"],
		}
		if payloadJSON, ok := params["payloadJSON"].(string); ok {
			resp.payloadJSON = payloadJSON
		}
		if rawError, ok := params["error"].(map[string]any); ok {
			resp.error = &invokeError{
				Code:    strings.TrimSpace(asString(rawError["code"])),
				Message: strings.TrimSpace(asString(rawError["message"])),
			}
		}
		if !b.resolveInvokeWaiter(invokeID, resp) {
			writeJSON(map[string]any{
				"type": "res",
				"id":   id,
				"ok":   false,
				"error": map[string]any{
					"code":    "UNAVAILABLE",
					"message": "invoke waiter missing",
				},
			})
			return
		}
		writeJSON(map[string]any{
			"type":    "res",
			"id":      id,
			"ok":      true,
			"payload": map[string]any{"ok": true},
		})

	case "agents.list":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"agents": []any{
					map[string]any{
						"id":   "agent-solanaos-main",
						"name": "SolanaOS",
						"identity": map[string]any{
							"name": "SolanaOS",
						},
						"status": "idle",
					},
				},
				"mainKey": "main",
			},
		})

	case "agents.create":
		agentName, _ := params["name"].(string)
		if agentName == "" {
			agentName = "Agent"
		}
		newID := "agent-" + generateShortID()
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"ok":        true,
				"agentId":   newID,
				"name":      agentName,
				"workspace": "/tmp/solanaos/workspace-" + newID,
			},
		})
		PushConvexEvent(ConvexEvent{
			Kind:    "agent_create",
			AgentID: newID,
			Payload: map[string]any{"name": agentName},
		})

	case "agents.delete":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"ok":              true,
				"removedBindings": 0,
			},
		})

	case "config.get":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"path": "/Users/8bit/.solanaos/solanaos.json",
				"config": map[string]any{
					"gateway": map[string]any{
						"port": 18790,
					},
				},
			},
		})

	case "sessions.list":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"sessions": []any{},
			},
		})

	case "exec.approvals":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"approvals": []any{},
			},
		})

	case "chat.send":
		runID := "run-" + generateShortID()
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"runId": runID,
			},
		})
		PushConvexEvent(ConvexEvent{
			Kind:   "chat",
			Method: "chat.send",
			Payload: map[string]any{"runId": runID},
		})

	case "chat.history":
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   true,
			"payload": map[string]any{
				"messages": []any{},
			},
		})

	default:
		writeJSON(map[string]any{
			"type": "res",
			"id":   id,
			"ok":   false,
			"error": map[string]any{
				"code":    "UNKNOWN_METHOD",
				"message": "unsupported method: " + method,
			},
		})
	}
}

func (b *Bridge) handlePageAgentDispatch(params map[string]any) invokeResponse {
	taskParams, _ := params["params"].(map[string]any)
	task, _ := taskParams["task"].(string)
	if strings.TrimSpace(task) == "" {
		return invokeResponse{ok: false, error: &invokeError{Code: "INVALID_REQUEST", Message: "params.task required"}}
	}
	hubURL := strings.TrimRight(os.Getenv("SEEKER_SITE_URL"), "/")
	if hubURL == "" {
		hubURL = "https://solanaos.net"
	}
	paModel := strings.TrimSpace(os.Getenv("PAGEAGENT_MODEL"))
	if paModel == "" {
		paModel = "claude-sonnet-4-6"
	}
	paBaseURL := strings.TrimSpace(os.Getenv("PAGEAGENT_LLM_BASE_URL"))
	if paBaseURL == "" {
		paBaseURL = strings.TrimSpace(os.Getenv("ANTHROPIC_BASE_URL"))
	}
	if paBaseURL == "" {
		paBaseURL = "http://localhost:4000"
	}
	paAPIKey := strings.TrimSpace(os.Getenv("PAGEAGENT_LLM_API_KEY"))
	if paAPIKey == "" {
		paAPIKey = strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY"))
	}
	configMap := map[string]string{
		"model":   paModel,
		"baseURL": paBaseURL,
	}
	if paAPIKey != "" {
		configMap["apiKey"] = paAPIKey
	}
	payload := map[string]interface{}{
		"task":   task,
		"config": configMap,
	}
	data, _ := json.Marshal(payload)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, "POST", hubURL+"/api/pageagent/task", bytes.NewReader(data))
	if err != nil {
		return invokeResponse{ok: false, error: &invokeError{Code: "HTTP_ERROR", Message: err.Error()}}
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := (&http.Client{Timeout: 15 * time.Second}).Do(req)
	if err != nil {
		return invokeResponse{ok: false, error: &invokeError{Code: "HTTP_ERROR", Message: err.Error()}}
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return invokeResponse{ok: resp.StatusCode < 300, payloadJSON: string(body)}
}

func (b *Bridge) handleNodeInvokeRequest(params map[string]any) invokeResponse {
	command, _ := params["command"].(string)
	if strings.TrimSpace(command) == "" {
		return invokeResponse{
			ok: false,
			error: &invokeError{
				Code:    "INVALID_REQUEST",
				Message: "command required",
			},
		}
	}
	// Intercept pageagent commands — these go to the Hub API, not to a connected node.
	if command == "pageagent.dispatch" {
		return b.handlePageAgentDispatch(params)
	}
	if command == "pageagent.status" {
		// TODO: implement status polling
		return invokeResponse{ok: false, error: &invokeError{Code: "NOT_IMPLEMENTED", Message: "pageagent.status not yet implemented"}}
	}
	nodeID, _ := params["nodeId"].(string)
	target, err := b.resolveInvokeTarget(nodeID)
	if err != nil {
		return invokeResponse{
			ok: false,
			error: &invokeError{
				Code:    "NODE_NOT_AVAILABLE",
				Message: err.Error(),
			},
		}
	}
	invokeID, _ := params["id"].(string)
	if strings.TrimSpace(invokeID) == "" {
		invokeID = "invoke-" + generateShortID()
	}
	timeoutMs := asInt64(params["timeoutMs"])
	if timeoutMs <= 0 {
		timeoutMs = 15000
	}
	payload := map[string]any{
		"id":        invokeID,
		"nodeId":    target.nodeID,
		"command":   command,
		"timeoutMs": timeoutMs,
	}
	if params["params"] != nil {
		payload["params"] = params["params"]
	}
	if paramsJSON, ok := params["paramsJSON"].(string); ok && strings.TrimSpace(paramsJSON) != "" {
		payload["paramsJSON"] = paramsJSON
	}
	waiter := b.registerInvokeWaiter(invokeID)
	if err := target.sendInvokeRequest(payload); err != nil {
		b.cancelInvokeWaiter(invokeID)
		return invokeResponse{
			ok: false,
			error: &invokeError{
				Code:    "UNAVAILABLE",
				Message: err.Error(),
			},
		}
	}
	select {
	case response, ok := <-waiter:
		if !ok {
			return invokeResponse{
				ok: false,
				error: &invokeError{
					Code:    "UNAVAILABLE",
					Message: "invoke waiter closed",
				},
			}
		}
		return response
	case <-time.After(time.Duration(timeoutMs+1000) * time.Millisecond):
		b.cancelInvokeWaiter(invokeID)
		return invokeResponse{
			ok: false,
			error: &invokeError{
				Code:    "TIMEOUT",
				Message: "invoke timed out",
			},
		}
	}
}

func generateWSNonce() string {
	buf := make([]byte, 16)
	_, _ = rand.Read(buf)
	return hex.EncodeToString(buf)
}

// ── Connection helpers ──────────────────────────────────────────────

// bufReaderConn wraps a net.Conn so reads drain the bufio.Reader first
// (which may contain peeked/buffered bytes), then fall through to the conn.
type bufReaderConn struct {
	Reader *bufio.Reader
	net.Conn
}

func (c *bufReaderConn) Read(b []byte) (int, error) {
	return c.Reader.Read(b)
}

// singleConnListener serves exactly one connection to http.Server.Serve.
type singleConnListener struct {
	conn net.Conn
	done chan struct{}
	once sync.Once
}

func (l *singleConnListener) Accept() (net.Conn, error) {
	var conn net.Conn
	l.once.Do(func() { conn = l.conn })
	if conn != nil {
		return conn, nil
	}
	<-l.done
	return nil, net.ErrClosed
}

func (l *singleConnListener) Close() error   { return nil }
func (l *singleConnListener) Addr() net.Addr { return l.conn.LocalAddr() }

// isHTTPRequest checks if peeked bytes look like an HTTP request (e.g. "GET / HTTP/1.1").
func isHTTPRequest(peeked []byte) bool {
	s := strings.ToUpper(string(peeked))
	return strings.HasPrefix(s, "GET ") ||
		strings.HasPrefix(s, "POST ") ||
		strings.HasPrefix(s, "PUT ") ||
		strings.HasPrefix(s, "HEAD ")
}

func asString(value any) string {
	if str, ok := value.(string); ok {
		return str
	}
	return ""
}

func asInt64(value any) int64 {
	switch typed := value.(type) {
	case float64:
		return int64(typed)
	case float32:
		return int64(typed)
	case int:
		return int64(typed)
	case int64:
		return typed
	case int32:
		return int64(typed)
	case json.Number:
		v, _ := typed.Int64()
		return v
	default:
		return 0
	}
}

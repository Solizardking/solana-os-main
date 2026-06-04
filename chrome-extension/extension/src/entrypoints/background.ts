import { handlePageControlMessage } from '@/agent/RemotePageController.background'
import { handleTabControlMessage, setupTabChangeEvents } from '@/agent/TabsController.background'

export default defineBackground(() => {
	console.log('[Background] SolanaOS Agent Service Worker started')

	// tab change events

	setupTabChangeEvents()

	// generate user auth token

	chrome.storage.local.get('PageAgentExtUserAuthToken').then((result) => {
		if (result.PageAgentExtUserAuthToken) return

		const userAuthToken = crypto.randomUUID()
		chrome.storage.local.set({ PageAgentExtUserAuthToken: userAuthToken })
	})

	// message proxy

	chrome.runtime.onMessage.addListener((message, sender, sendResponse): true | undefined => {
		if (message.type === 'TAB_CONTROL') {
			return handleTabControlMessage(message, sender, sendResponse)
		} else if (message.type === 'PAGE_CONTROL') {
			return handlePageControlMessage(message, sender, sendResponse)
		} else if (message.type === 'SOLANA_WALLET') {
			handleSolanaWalletMessage(message, sendResponse)
			return true
		} else {
			sendResponse({ error: 'Unknown message type' })
			return
		}
	})

	// external messages (from localhost launcher page via externally_connectable)

	chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
		if (message.type === 'OPEN_HUB') {
			openOrFocusHubTab(message.wsPort).then(() => {
				if (sender.tab?.id) chrome.tabs.remove(sender.tab.id)
				sendResponse({ ok: true })
			})
			return true
		}
	})

	// setup

	chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {})
})

async function handleSolanaWalletMessage(
	message: any,
	sendResponse: (response: any) => void
) {
	const { action, params } = message
	try {
		const stored = await chrome.storage.local.get('solanaWallet')
		const wallet = stored.solanaWallet || {}

		switch (action) {
			case 'get_address': {
				sendResponse({ address: wallet.publicKey || null })
				break
			}
			case 'get_balance': {
				if (!wallet.publicKey) {
					sendResponse({ error: 'No wallet connected' })
					break
				}
				const rpcUrl = wallet.rpcUrl || 'https://api.mainnet-beta.solana.com'
				const resp = await fetch(rpcUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						jsonrpc: '2.0',
						id: 1,
						method: 'getBalance',
						params: [wallet.publicKey],
					}),
				})
				const data = await resp.json()
				const lamports = data.result?.value ?? 0
				sendResponse({ balance: lamports / 1e9, lamports })
				break
			}
			case 'save_wallet': {
				await chrome.storage.local.set({ solanaWallet: params })
				sendResponse({ ok: true })
				break
			}
			default:
				sendResponse({ error: `Unknown wallet action: ${action}` })
		}
	} catch (err: any) {
		sendResponse({ error: err.message || String(err) })
	}
}

async function openOrFocusHubTab(wsPort: number) {
	const hubUrl = chrome.runtime.getURL('hub.html')
	const existing = await chrome.tabs.query({ url: `${hubUrl}*` })

	if (existing.length > 0 && existing[0].id) {
		await chrome.tabs.update(existing[0].id, {
			active: true,
			url: `${hubUrl}?ws=${wsPort}`,
		})
		return
	}

	await chrome.tabs.create({ url: `${hubUrl}?ws=${wsPort}`, pinned: true })
}

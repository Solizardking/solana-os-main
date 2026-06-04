import SwiftUI

@main
struct OpenClawdWatchApp: App {
    @StateObject private var walletState = WalletState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(walletState)
        }
    }
}

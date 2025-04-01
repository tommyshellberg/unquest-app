import ExpoModulesCore
import UIKit

public class LockStateModule: Module {
  private var backgroundObserver: NSObjectProtocol?
  private var foregroundObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("LockState")

    Events("LOCKED", "UNLOCKED")

    OnCreate {
      self.backgroundObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.didEnterBackgroundNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendEvent("LOCKED", ["reason": "App entered background"])
      }

      self.foregroundObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.willEnterForegroundNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.sendEvent("UNLOCKED", ["reason": "App entered foreground"])
      }
    }

    OnDestroy {
      if let bgObs = self.backgroundObserver {
        NotificationCenter.default.removeObserver(bgObs)
        self.backgroundObserver = nil
      }
      if let fgObs = self.foregroundObserver {
        NotificationCenter.default.removeObserver(fgObs)
        self.foregroundObserver = nil
      }
    }
  }
}

import ActivityKit
import WidgetKit
import SwiftUI
import OneSignalLiveActivities

struct liveactivitiesLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: DefaultLiveActivityAttributes.self) { context in
            // --- Calculate Dates First ---
            let pendingQuest = context.state.data["pending"]?.asBool() ?? false
            let durationMinutes = context.state.data["durationMinutes"]?.asInt() ?? 0
            let title = context.attributes.data["title"]?.asString() ?? "Quest Active"
            let (computedStartDate, computedEndDate) = { () -> (Date, Date) in
                if pendingQuest {
                    let now = Date()
                    return (now, now)
                } else {
                    let start = Date()
                    return (start, start.addingTimeInterval(TimeInterval(durationMinutes * 60)))
                }
            }()

            let isComplete = !pendingQuest && (Date() >= computedEndDate)
            let displayTitle = pendingQuest ? "Quest Ready" : (isComplete ? "Quest Complete!" : title)
            let displayDescription = pendingQuest ? "Lock your phone to begin" : (isComplete ? "Congratulations on finishing your quest!" : "Focus for \(durationMinutes) minutes")

            // --- Lock Screen View (No TimelineView) ---
            HStack(spacing: 0) {
                // LEFT: App icon
                VStack {
                    Spacer()
                    Image(systemName: "map")
                        .font(.system(size: 50))
                        .symbolRenderingMode(.hierarchical)
                        .foregroundStyle(Color(red: 119/255, green: 197/255, blue: 191/255))
                        .padding(.horizontal, 12)
                    Spacer()
                }
                .frame(maxWidth: UIScreen.main.bounds.width * 0.25)
                
                // RIGHT: Text content
                VStack(alignment: .leading, spacing: 4) {
                    Spacer()
                    Text(displayTitle)
                        .font(.headline)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                    
                    Text(displayDescription)
                        .font(.subheadline)
                        .lineLimit(2)
                        .minimumScaleFactor(0.8)
                        
                    if pendingQuest {
                        ProgressView(value: 0.01, total: 1.0)
                            .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 119/255, green: 197/255, blue: 191/255)))
                            .padding(.vertical, 2)
                    } else {
                        ProgressView(timerInterval: computedStartDate...computedEndDate, countsDown: false,
                                     label: { EmptyView() },
                                     currentValueLabel: { EmptyView() })
                            .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 119/255, green: 197/255, blue: 191/255)))
                            .padding(.vertical, 2)
                    }
                    
                    Spacer()
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity)
            }
            
        } dynamicIsland: { context in
            // --- Dynamic Island (Remains the same as last working version) ---
            let pendingQuest = context.state.data["pending"]?.asBool() ?? false
            let durationMinutes = context.state.data["durationMinutes"]?.asInt() ?? 0
            let title = context.attributes.data["title"]?.asString() ?? "Quest"
            let (computedStartDate, computedEndDate) = { () -> (Date, Date) in
                if pendingQuest {
                    let now = Date()
                    return (now, now)
                } else {
                    let start = Date()
                    return (start, start.addingTimeInterval(TimeInterval(durationMinutes * 60)))
                }
            }()

            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "map")
                        .font(.system(size: 20))
                        .foregroundStyle(Color(red: 119/255, green: 197/255, blue: 191/255))
                }
                DynamicIslandExpandedRegion(.trailing) {
                    // Timer text (if needed) can be re-added here,
                    // but we keep it as before for now.
                    Text(timerInterval: computedStartDate...computedEndDate, countsDown: false, showsHours: false)
                        .font(.caption)
                        .monospacedDigit()
                        .bold()
                        .frame(width: 45)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(title)
                        .font(.caption)
                        .lineLimit(1)
                }
                 DynamicIslandExpandedRegion(.bottom) {
                    if pendingQuest {
                        ProgressView(value: 0.01, total: 1.0)
                            .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 119/255, green: 197/255, blue: 191/255)))
                            .padding(.top, 2)
                    } else {
                        ProgressView(timerInterval: computedStartDate...computedEndDate, countsDown: false,
                                     label: { EmptyView() },
                                     currentValueLabel: { EmptyView() })
                            .progressViewStyle(LinearProgressViewStyle(tint: Color(red: 119/255, green: 197/255, blue: 191/255)))
                            .padding(.top, 2)
                    }
                }
            } compactLeading: {
                Image(systemName: "map")
                    .foregroundStyle(Color(red: 119/255, green: 197/255, blue: 191/255))
                    .padding(.leading, 1)
            } compactTrailing: {
                Text(timerInterval: computedStartDate...computedEndDate, countsDown: false, showsHours: false)
                    .monospacedDigit()
                    .frame(width: 40)
                    .font(.caption)
            } minimal: {
                Image(systemName: "map")
                    .foregroundStyle(Color(red: 119/255, green: 197/255, blue: 191/255))
            }
        }
    }
}
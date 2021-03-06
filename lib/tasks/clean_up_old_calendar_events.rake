
desc "Remove CalendarEvents that are older than today"
task :clean_up_old_calendar_events => :environment do
  CalendarEvent.where("from_date < ?", Date.current.prev_day.beginning_of_day).each do |old_event|
    old_event.destroy
  end
end


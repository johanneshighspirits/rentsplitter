json.extract! calendar_event, :id, :from, :to, :booked_by, :created_at, :updated_at
json.url calendar_event_url(calendar_event, format: :json)

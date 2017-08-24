json.extract! calendar_event, :id, :from_date, :to_date, :booked_by, :created_at, :updated_at
json.url calendar_event_url(calendar_event, format: :json)

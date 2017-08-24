class RenameCalendarEventColumns < ActiveRecord::Migration[5.0]
  def change
    rename_column :calendar_events, :from, :from_date
    rename_column :calendar_events, :to, :to_date
  end
end

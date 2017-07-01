class CreateCalendarEvents < ActiveRecord::Migration[5.0]
  def change
    create_table :calendar_events do |t|
      t.datetime :from
      t.datetime :to
      t.references :member, foreign_key: true
      t.references :project, foreign_key: true

      t.timestamps
    end
  end
end

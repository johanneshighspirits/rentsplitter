class CreateRents < ActiveRecord::Migration[5.0]
  def change
    create_table :rents do |t|
      t.date :due_date
      t.decimal :amount
      t.references :project, foreign_key: true

      t.timestamps
    end
  end
end

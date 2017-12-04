class CreateExpenses < ActiveRecord::Migration[5.0]
  def change
    create_table :expenses do |t|
      t.string :description
      t.decimal :amount
      t.date :registered_at
      t.references :project, foreign_key: true

      t.timestamps
    end
  end
end

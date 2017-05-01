class CreateTransfers < ActiveRecord::Migration[5.0]
  def change
    create_table :transfers do |t|
      t.decimal :amount
      t.string :message
      t.date :transferred_at

      t.timestamps
    end
  end
end

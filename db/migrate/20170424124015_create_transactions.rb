class CreateTransactions < ActiveRecord::Migration[5.0]
  def change
    create_table :transactions do |t|
      t.string :message
      t.decimal :amount
      t.date :date

      t.timestamps
    end
  end
end

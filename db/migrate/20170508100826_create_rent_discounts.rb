class CreateRentDiscounts < ActiveRecord::Migration[5.0]
  def change
    create_table :rent_discounts do |t|
      t.decimal :amount
      t.string :message
      t.date :transferred_at
      t.references :project, foreign_key: true

      t.timestamps
    end
  end
end

class AddIndexToRentDiscounts < ActiveRecord::Migration[5.0]
  def change
    add_index :rent_discounts, [:message, :amount, :transferred_at], unique: true
  end
end

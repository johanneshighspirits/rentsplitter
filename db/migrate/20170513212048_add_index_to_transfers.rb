class AddIndexToTransfers < ActiveRecord::Migration[5.0]
  def change
    add_index :transfers, [:message, :amount, :transferred_at], unique: true
  end
end

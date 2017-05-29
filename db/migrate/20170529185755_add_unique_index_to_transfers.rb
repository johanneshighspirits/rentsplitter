class AddUniqueIndexToTransfers < ActiveRecord::Migration[5.0]
  def change
    add_index :transfers, [:message, :amount, :transferred_at, :membership_id], name: 'transfers_unique_index', unique: true
  end
end

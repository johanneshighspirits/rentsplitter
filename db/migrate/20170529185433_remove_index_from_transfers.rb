class RemoveIndexFromTransfers < ActiveRecord::Migration[5.0]
  def change
    remove_index :transfers, column: [:message, :amount, :transferred_at]
  end
end

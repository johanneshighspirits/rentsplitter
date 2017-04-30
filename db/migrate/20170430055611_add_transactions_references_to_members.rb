class AddTransactionsReferencesToMembers < ActiveRecord::Migration[5.0]
  def change
    add_reference :members, :transactions, foreign_key: true
  end
end

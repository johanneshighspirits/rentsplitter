class AddProjectRefsToTransactions < ActiveRecord::Migration[5.0]
  def change
    add_reference :transactions, :project, foreign_key: true
  end
end

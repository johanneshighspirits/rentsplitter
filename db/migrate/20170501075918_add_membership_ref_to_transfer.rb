class AddMembershipRefToTransfer < ActiveRecord::Migration[5.0]
  def change
    add_reference :transfers, :membership, foreign_key: true
  end
end

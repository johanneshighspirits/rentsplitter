class RemoveJoinAndLeftDatesFromMembers < ActiveRecord::Migration[5.0]
  def change
    remove_column :members, :joined_at
    remove_column :members, :left_at
  end
end

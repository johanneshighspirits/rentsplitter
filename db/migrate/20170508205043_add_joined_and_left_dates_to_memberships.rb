class AddJoinedAndLeftDatesToMemberships < ActiveRecord::Migration[5.0]
  def change
    add_column :memberships, :joined_at, :date
    add_column :memberships, :left_at, :date
  end
end

class ChangeDateFormatsInMembers < ActiveRecord::Migration[5.0]

  def up
    change_column :members, :joined_at, :date
    change_column :members, :left_at, :date
  end

  def down
    change_column :members, :joined_at, :datetime
    change_column :members, :left_at, :datetime
  end

end

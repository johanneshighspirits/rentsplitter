class AddActivatedToMembers < ActiveRecord::Migration[5.0]
  def change
    add_column :members, :activated, :boolean, default: false
  end
end

class AddAdminIdToProjects < ActiveRecord::Migration[5.0]
  def change
    add_column :projects, :admin_id, :integer
  end
end

class AddCurrentProjectToMembers < ActiveRecord::Migration[5.0]
  def change
    add_column :members, :current_project_id, :integer
  end
end

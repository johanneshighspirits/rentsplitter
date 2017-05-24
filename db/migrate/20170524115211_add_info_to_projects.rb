class AddInfoToProjects < ActiveRecord::Migration[5.0]
  def change
    add_column :projects, :info, :string
  end
end

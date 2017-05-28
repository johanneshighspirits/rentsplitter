class AddAccountInfoToProjects < ActiveRecord::Migration[5.0]
  def change
    add_column :projects, :account_info, :string
  end
end

class AddBonusToProjects < ActiveRecord::Migration[5.0]
  def change
    add_column :projects, :bonus, :decimal
  end
end

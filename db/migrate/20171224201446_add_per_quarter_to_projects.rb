class AddPerQuarterToProjects < ActiveRecord::Migration[5.0]
  def change
    add_column :projects, :perQuarter, :boolean, default: false
  end
end

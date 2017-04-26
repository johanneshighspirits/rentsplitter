class AddPatternToMembers < ActiveRecord::Migration[5.0]
  def change
    add_column :members, :pattern, :string
  end
end

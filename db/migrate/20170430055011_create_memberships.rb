class CreateMemberships < ActiveRecord::Migration[5.0]
  def change
    create_table :memberships do |t|
      t.references :member, foreign_key: true
      t.references :project, foreign_key: true

      t.timestamps
    end
  end
end

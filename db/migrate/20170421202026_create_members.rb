class CreateMembers < ActiveRecord::Migration[5.0]
  def change
    create_table :members do |t|
      t.string :name
      t.string :email
      t.datetime :joined_at
      t.datetime :left_at

      t.timestamps
    end
  end
end

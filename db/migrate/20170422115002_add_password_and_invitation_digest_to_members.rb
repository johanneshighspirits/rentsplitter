class AddPasswordAndInvitationDigestToMembers < ActiveRecord::Migration[5.0]
  def change
    add_column :members, :password_digest, :string
    add_column :members, :invitation_digest, :string
  end
end

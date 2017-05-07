class Membership < ApplicationRecord

  after_create :assign_admin

  belongs_to :member
  belongs_to :project
  has_many :transfers

  def assign_admin
    # The member who creates the project is
    # assigned as its admin
    project.admin_id = member.id
    project.save
  end

end

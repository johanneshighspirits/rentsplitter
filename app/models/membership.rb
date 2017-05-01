class Membership < ApplicationRecord
  belongs_to :member
  belongs_to :project
  has_many :transfers
end

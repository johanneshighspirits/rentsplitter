class Project < ApplicationRecord
  has_many :memberships
  has_many :members, through: :memberships
  has_many :transactions, through: :members
end

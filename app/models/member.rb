class Member < ApplicationRecord
  attr_accessor :remember_token, :invitation_token, :reset_token
  before_create :create_invitation_digest
  before_create :set_join_and_left_dates
  before_create :create_pattern
  before_save { email.downcase! }
  after_save :check_current_project_id

  validates :name, presence: true, length: { maximum: 200 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
  validates :email, presence: true, length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, allow_nil: true

  has_secure_password
  has_many :memberships
  has_many :projects, through: :memberships
  has_many :transfers, through: :memberships

  # Returns the hash digest of a given string
  def Member.digest(string)
    cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST :
                                                  BCrypt::Engine.cost
    BCrypt::Password.create(string, cost: cost)
  end
  
  # Returns a random token
  def Member.new_token
    SecureRandom.urlsafe_base64
  end

  # Activate an account
  def activate
    update_columns(activated: true, activated_at: Time.zone.now)
  end

  # Sends invitation email
  def send_invitation_email
    MemberMailer.invitation(self).deliver_now
  end

  # Sets the password reset attributes
  def create_reset_digest
    self.reset_token = Member.new_token
    update_columns(reset_digest: Member.digest(reset_token), reset_sent_at: Time.zone.now)
  end

  # Sends password reset email
  def send_password_reset_email
    MemberMailer.password_reset(self).deliver_now
  end

  # Remember user
  def remember
    # Generate random token
    self.remember_token = Member.new_token
    # Store the digested/hashed token
    update_attribute(:remember_digest, Member.digest(remember_token))
  end

  # Returns true if the given token matches the digest
  def authenticated?(attribute, token)
    digest = send("#{attribute}_digest")
    return false if digest.nil?
    BCrypt::Password.new(digest).is_password?(token)
  end

  # Forget user
  def forget
    update_attribute(:remember_digest, nil)
  end

  def password_reset_expired?
    reset_sent_at < 2.hours.ago
  end

  private

    def create_invitation_digest
      self.invitation_token = Member.new_token
      self.invitation_digest = Member.digest(invitation_token)
    end

    def set_join_and_left_dates
      self.joined_at = Date.current.beginning_of_month.to_date
      self.left_at = 20.years.from_now
    end

    def create_pattern
      self.pattern = pattern.nil? ? name.downcase : pattern
    end

    def check_current_project_id
      if current_project_id.nil?
        project_id = projects.empty? ? 0 : projects.first.id
        update_attribute(:current_project_id, project_id)
      else
        puts "WARNING: No project id for member #{self.name}"
      end
    end

end

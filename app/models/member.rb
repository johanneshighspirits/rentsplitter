class Member < ApplicationRecord
  attr_accessor :remember_token, :invitation_token, :reset_token
  before_create :create_invitation_digest
  # before_create :set_join_and_left_dates
  before_create :create_pattern
  before_save { email.downcase! }
  after_save :check_current_project_id
  after_destroy :remove_members_projects

  validates :first_name, :last_name, presence: true, length: { maximum: 200 }
  VALID_EMAIL_REGEX = /\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i
  validates :email, presence: true, length: { maximum: 255 },
                    format: { with: VALID_EMAIL_REGEX },
                    uniqueness: { case_sensitive: false }
  validates :password, presence: true, length: { minimum: 6 }, allow_nil: true

  has_secure_password
  has_many :memberships, dependent: :destroy
  has_many :calendar_events, dependent: :destroy

  has_many :projects, through: :memberships
  has_many :transfers, through: :memberships
  accepts_nested_attributes_for :memberships

  # Returns Member's full name
  def name
    "#{first_name} #{last_name}"
  end

  def initials
    "#{first_name[0].upcase}#{last_name[0].upcase}"
  end

  # Returns Member's invoice identifier
  def invoice_identifier(project)
    short_month_name = "-" + Date::MONTHNAMES[Date.current.next_month.month].slice(0,3).upcase || ""
    if project.perQuarter
      quarter = ((Date.current.month / 12.0) * 4.0).floor + 1
      if quarter == 5
        quarter = 1
      end
      short_month_name = "-Q#{quarter}"
    end
    "#{initials}#{id}-#{project.id}#{short_month_name}"
  end

  # Return project and member from identifier
  def Member.decode_invoice_identifier(identifier)
    identifier_regex = /^([\D]{2})([0-9]+)\-([0-9]+)\-?([A-Z]{3}|Q[1-4]{1})?$/
    matches = identifier_regex.match(identifier)
    if matches
      {
        initials: matches[1],
        member_id: matches[2],
        project_id: matches[3],
        month: matches[4]
      }
    else
      return nil
    end
  end

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
    update_columns(activated: true)
    MemberMailer.invitation_accepted(self).deliver_now unless current_project_id == 0
  end

  # Sends invitation email
  def send_invitation_email(info)
    create_invitation_digest
    # Invite member
    MemberMailer.invitation(self, info).deliver_now
    update(invited: true)
    # Notice project admin that an invitation has been sent
    MemberMailer.invitation_sent(self).deliver_now
  end

  # Sends activation email
  def send_activation_email
    # create_invitation_digest
    MemberMailer.activation(self).deliver_now
  end

  # Sends booking confirmation email
  def send_booking_email(info)
    # Send email with booking confirmation
    MemberMailer.booking(self, info).deliver_now
  end

  # Sends invoice email
  def send_invoice_email(info)
    MemberMailer.invoice(self, info).deliver_now
  end

  # If member is admin of a project, it's time to
  # send invoices to all members.
  def send_invoice_reminder(project)
    MemberMailer.invoice_reminder_for_project_admin(self, project).deliver_now
  end

  # Sets the password reset attributes
  def create_reset_digest
    self.reset_token = Member.new_token
    update_attribute(:reset_digest, Member.digest(reset_token))
    update_attribute(:reset_sent_at, Time.zone.now)
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
    p self
    puts "Authenticating #{attribute} with #{token}"
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

  # Open Project
  def open_project(p_id)
    update_attribute(:current_project_id, p_id)
  end

  private

    def create_invitation_digest
      self.invitation_token = Member.new_token
      self.invitation_digest = Member.digest(invitation_token)
    end

    # def set_join_and_left_dates
    #   self.joined_at = Date.current.beginning_of_month.to_date
    #   self.left_at = 20.years.from_now
    # end

    def create_pattern
      self.pattern = pattern.nil? ? first_name.downcase : pattern
    end

    def check_current_project_id
      if current_project_id.nil?
        project_id = projects.empty? ? 0 : projects.first.id
        update_attribute(:current_project_id, project_id)
      end
    end

    def remove_members_projects
      self.projects.where(admin_id: self.id).each do |project|
        project.destroy
      end
    end


end

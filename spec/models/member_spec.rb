require "rails_helper"

describe Member, type: :model do
  subject = create :member

  it "sends an email" do
    info = {
      sender: Member.first,
      project: Project.first
    }
    expect { subject.send_invitation_email }
      .to change { ActionMailer::Base.deliveries.count }.by(1)
  end
end
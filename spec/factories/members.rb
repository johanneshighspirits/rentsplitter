FactoryGirl.define do
  factory :member do
    name "Member Membersson"
    email "member@example.com"
    password_digest { Member.digest("password") }

    # trait :invited do
    #   invitation_digest "invitation_digest_here"
    # end

    # trait :not_invited do
    #   invitation_digest "no_invitation_digest_signed_up_myself"
    # end

    trait :activated do
      activated true
    end

    # trait :not_activated do
    #   active false
    # end

  end
  
end
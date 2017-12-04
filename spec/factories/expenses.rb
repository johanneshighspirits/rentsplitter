FactoryGirl.define do
  factory :expense do
    description "MyString"
    amount "9.99"
    registered_at "2017-12-04"
    project nil
  end
end

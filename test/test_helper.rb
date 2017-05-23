ENV['RAILS_ENV'] ||= 'test'
require File.expand_path('../../config/environment', __FILE__)
require 'rails/test_help'

class ActiveSupport::TestCase
  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  # Add more helper methods to be used by all tests here...
  include ApplicationHelper

  def is_logged_in?
    !session[:member_id].nil?
  end

  def log_in_as(member)
    session[:member_id] = member.id
    session[:project_id] = member.current_project_id
  end

end

class ActionDispatch::IntegrationTest
  
  # Log in as a particular member.
  def log_in_as(member, password: 'password', remember_me: '1')
    post login_path, params: {
      session: { 
        email: member.email,
        password: password,
        remember_me: remember_me 
      } 
    }
    session[:project_id] = member.current_project_id
  end

  def log_out
    session.delete(:member_id)
  end

end

class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  include SessionsHelper

  def index
    if logged_in?
      @members = Member.all
      puts "Logged in as #{current_member.name}"
    else
      puts "Not logged_in"
      render html: 'You need a special invitation to see this page'
    end
  end

end

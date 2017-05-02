Rails.application.routes.draw do
  root 'application#index'

  get     '/login',   to: 'sessions#new'
  post    '/login',   to: 'sessions#create'
  delete  '/logout',  to: 'sessions#destroy'

  post    '/transfers/many', to: 'transfers#create_many'

  resources :members
  resources :transfers
  resources :invitations, only: [:edit]

end

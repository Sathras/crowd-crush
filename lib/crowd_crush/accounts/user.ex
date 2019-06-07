defmodule CrowdCrush.Accounts.User do
  use CrowdCrush, :schema
  alias CrowdCrush.Accounts.Credential

  schema "users" do
    field :username, :string
    has_one :credential, Credential
    timestamps()
  end

  def registration_changeset(user, params) do
    user
    |> changeset(params)
    |> cast_assoc(:credential, with: &Credential.changeset/2, required: true)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:username])
    |> validate_required([:username])
    |> validate_length(:username, min: 3, max: 20)
  end
end

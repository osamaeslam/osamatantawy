using Firebase.Auth;
using Newtonsoft.Json;
using RaneenProject.Views.ProfilePageViews;
using RaneenProject.Views.UserAccountViews;
using System;
using System.Windows.Input;
using Xamarin.Essentials;
using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views.ProfilePageViews
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class ProfilePage : ContentPage
    {
        public string WebAPIkey = "AIzaSyDsFm9Tuv4Brz9WJM4Q-qVLzd5wtLpie80";

        public ICommand TapCommandAccount => new Command(AccountInformationPage);
        public ICommand TapCommandWishlist => new Command(WishlistPage);
        public ICommand TapCommandAboutus => new Command(AboutUsPage);
        public ICommand TapCommandLandingPage => new Command(Logout_Clicked);

        private void AccountInformationPage(object obj)
        {           
            var targetpage = new AccountInformationPage();
            NavigationPage.SetHasNavigationBar(targetpage, false);
            Navigation.PushAsync(targetpage);
        }

        private void WishlistPage(object obj)
        {
            var targetpage = new WishlistPage();
            NavigationPage.SetHasNavigationBar(targetpage, false);
            Navigation.PushAsync(targetpage);
        }

        private void AboutUsPage(object obj)
        {
            var targetpage = new AboutUsWithScrollPage();
            NavigationPage.SetHasNavigationBar(targetpage, false);
            Navigation.PushAsync(targetpage);
        }

        public ProfilePage()
        {
            InitializeComponent();
            GetProfileInformationAndRefreshToken();
            BindingContext = this;
        }

        async private void GetProfileInformationAndRefreshToken()
        {
            var authProvider = new FirebaseAuthProvider(new FirebaseConfig(WebAPIkey));
            try
            {
                //This is the saved firebaseauthentication that was saved during the time of login
                var savedfirebaseauth = JsonConvert.DeserializeObject<Firebase.Auth.FirebaseAuth>(Preferences.Get("MyFirebaseRefreshToken", ""));
                //Here we are Refreshing the token
                var RefreshedContent = await authProvider.RefreshAuthAsync(savedfirebaseauth);
                Preferences.Set("MyFirebaseRefreshToken", JsonConvert.SerializeObject(RefreshedContent));

                //Now lets grab user information
                MyUserEmail.Text = savedfirebaseauth.User.Email;
                MyUserName.Text = $"{savedfirebaseauth.User.FirstName} {savedfirebaseauth.User.LastName}";
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
                await App.Current.MainPage.DisplayAlert("Alert", "Oh no !  Token expired", "OK");
            }
        }

        void Logout_Clicked(object obj)
        {
            Preferences.Remove("MyFirebaseRefreshToken");

            var targetpage = new LandingPage();
            NavigationPage.SetHasNavigationBar(targetpage, false);
            Navigation.PushAsync(targetpage);
        }
    }
}
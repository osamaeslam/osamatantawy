using Newtonsoft.Json;
using RaneenProject.Views.ProfilePageViews;
using System;
using Xamarin.Essentials;
using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views.UserAccountViews
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class LandingPage : ContentPage
    {
        public LandingPage()
        {
            InitializeComponent();

            var savedfirebaseauth = JsonConvert.DeserializeObject<Firebase.Auth.FirebaseAuth>(Preferences.Get("MyFirebaseRefreshToken", ""));
            if (savedfirebaseauth != null)
            {
                var targetpage = new ProfilePage();
                NavigationPage.SetHasNavigationBar(targetpage, false);
                Navigation.PushAsync(targetpage);
            }
        }

        protected override async void OnAppearing()
        {
            var savedfirebaseauth = JsonConvert.DeserializeObject<Firebase.Auth.FirebaseAuth>(Preferences.Get("MyFirebaseRefreshToken", ""));
            if (savedfirebaseauth != null)
            {
                var targetpage = new ProfilePage();
                NavigationPage.SetHasNavigationBar(targetpage, false);
                Navigation.PushAsync(targetpage);
                //Navigation.PopAsync();
            }
        }

        private void signinPage(object sender, EventArgs e)
        {
            var targetpage = new LoginPage();
            NavigationPage.SetHasBackButton(targetpage, true);
            NavigationPage.SetHasNavigationBar(targetpage, true);
            Navigation.PushAsync(targetpage);
        }

        private void signupPage(object sender, EventArgs e)
        {
            var targetpage = new SignupPage();
            NavigationPage.SetHasBackButton(targetpage, true);
            NavigationPage.SetHasNavigationBar(targetpage, true);
            Navigation.PushAsync(targetpage);
        }
    }
}
using System;
using System.Windows.Input;
using Xamarin.Forms;
using Xamarin.Forms.Xaml;
using RaneenProject.Views.ProfilePageViews;
using Firebase.Auth;
using Newtonsoft.Json;
using Xamarin.Essentials;
using System.Linq;

namespace RaneenProject.Views.UserAccountViews
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class LoginPage : ContentPage
    {
        public string WebAPIkey = "AIzaSyDsFm9Tuv4Brz9WJM4Q-qVLzd5wtLpie80";

        // Launcher.OpenAsync is provided by Xamarin.Essentials.
        public ICommand TapCommand => new Command(SignupPage);

        private void SignupPage(object obj)
        {
            var targetpage = new SignupPage();
            NavigationPage.SetHasBackButton(targetpage, true);
            NavigationPage.SetHasNavigationBar(targetpage, true);
            Navigation.PushAsync(targetpage);
        }

        public LoginPage()
        {
            InitializeComponent();
            BindingContext = this;
        }

        protected override async void OnAppearing()
        {
            var savedfirebaseauth = JsonConvert.DeserializeObject<Firebase.Auth.FirebaseAuth>(Preferences.Get("MyFirebaseRefreshToken", ""));
            if (savedfirebaseauth != null)
            {
                //var targetpage = new ProfilePage();
                //NavigationPage.SetHasNavigationBar(targetpage, false);
                //Navigation.PushAsync(targetpage);
                Navigation.PopAsync();
            }
        }

        async void loginbutton_Clicked(System.Object sender, System.EventArgs e)
        {
            errormssg.IsVisible = false;

            var authProvider = new FirebaseAuthProvider(new FirebaseConfig(WebAPIkey));
            try
            {
                var auth = await authProvider.SignInWithEmailAndPasswordAsync(UserLoginEmail.Text, UserLoginPassword.Text);
                var content = await auth.GetFreshAuthAsync();
                var serializedcontnet = JsonConvert.SerializeObject(content);
                Preferences.Set("MyFirebaseRefreshToken", serializedcontnet);

                var targetpage = new ProfilePage();
                NavigationPage.SetHasNavigationBar(targetpage, false);

                //var existingPages = Navigation.NavigationStack.ToList();
                //foreach (var page in existingPages)
                //{
                //    Navigation.RemovePage(page);
                //}
                await Navigation.PushAsync(targetpage);
            }
            catch (Exception ex)
            {
                errormssg.IsVisible = true;
                //await App.Current.MainPage.DisplayAlert("Alert", ex.Message, "OK");
            }
        }

        private void backButton(object sender, EventArgs e)
        {
            Navigation.PopAsync();
        }
    }
}
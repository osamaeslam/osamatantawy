using System;
using Xamarin.Forms;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views.ProfilePageViews
{
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class AccountInformationPage : ContentPage
    {
        public AccountInformationPage()
        {
            InitializeComponent();
        }

        private void EditEmail(object sender, EventArgs e)
        {
            var targetpage = new EditEmail();
            NavigationPage.SetHasNavigationBar(targetpage, false);
            Navigation.PushAsync(targetpage);
        }

        private void EditInfo(object sender, EventArgs e)
        {
            var targetpage = new EditInfo();
            NavigationPage.SetHasNavigationBar(targetpage, false);
            Navigation.PushAsync(targetpage);
        }

        private void backButton(object sender, EventArgs e)
        {
            Navigation.PopAsync();
        }
    }
}
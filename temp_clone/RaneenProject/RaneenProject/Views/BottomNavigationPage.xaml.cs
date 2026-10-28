using RaneenProject.Views.ProfilePageViews;
using RaneenProject.Views.UserAccountViews;
using Xamarin.Forms;
using Xamarin.Forms.Internals;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views
{
    [Preserve(AllMembers = true)]
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class BottomNavigationPage : Shell
    {

        public BottomNavigationPage()
        {
            this.InitializeComponent();

            Routing.RegisterRoute(nameof(LandingPage),typeof(LandingPage));
        }
    }
}
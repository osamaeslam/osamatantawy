using Newtonsoft.Json;
using RaneenProject.Data;
using RaneenProject.DataService;
using RaneenProject.Models;
using RaneenProject.ViewModels;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using Xamarin.Essentials;
using Xamarin.Forms;
using Xamarin.Forms.Internals;
using Xamarin.Forms.Xaml;

namespace RaneenProject.Views
{
    /// <summary>
    /// Page to show the wishlist. 
    /// </summary>
    [Preserve(AllMembers = true)]
    [XamlCompilation(XamlCompilationOptions.Compile)]
    public partial class WishlistPage : ContentPage
    {
        public WishlistPage()
        {
            this.InitializeComponent();
            getList();

        }

        public async void getList()
        {
            UsersDB dB = new UsersDB();
            Firebase.Auth.FirebaseAuth savedfirebaseauth = JsonConvert.DeserializeObject<Firebase.Auth.FirebaseAuth>(Preferences.Get("MyFirebaseRefreshToken", ""));
            Users logedin = await dB.GetUser(savedfirebaseauth.User.Email);
            this.BindingContext = new WishlistPageViewModel()
            {
                WishlistDetails = JsonConvert.DeserializeObject<ObservableCollection<Product>>(logedin.Wishlist)
            };

        }
    }
}
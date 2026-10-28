using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Text;

namespace RaneenProject.Models
{
    public class Users
    {

        public String Firstname { get; set; }
        public String Lastname { get; set; }
        public String Email { get; set; }
        public String Phone { get; set; }
        public String Cart { get; set; }
        public String Wishlist { get; set; }

        public override string ToString()
        {
            return $"Ana Hna :D => {Email}, {Firstname}";
        }

    }
}
